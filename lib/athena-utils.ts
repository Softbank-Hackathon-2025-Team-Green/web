import { 
  AthenaClient, 
  StartQueryExecutionCommand, 
  GetQueryExecutionCommand, 
  GetQueryResultsCommand,
  QueryExecutionState 
} from '@aws-sdk/client-athena';

const athenaClient = new AthenaClient({
  region: process.env.AWS_REGION || 'ap-northeast-2'
});

const DATABASE = process.env.NEXT_PUBLIC_ATHENA_DATABASE || 'default';
const TABLE_NAME = process.env.NEXT_PUBLIC_ATHENA_TABLE_NAME || 'cuttyx-table';
const OUTPUT_LOCATION = process.env.NEXT_PUBLIC_ATHENA_OUTPUT_LOCATION || 's3://cuttyx-athena-results/';


export interface AthenaQueryResult {
  success: boolean;
  data?: any[];
  error?: string;
}

/**
 * Execute Athena query and wait for results
 */
export async function executeAthenaQuery(query: string): Promise<AthenaQueryResult> {
  try {
    // Start query execution
    const startCommand = new StartQueryExecutionCommand({
      QueryString: query,
      QueryExecutionContext: {
        Database: DATABASE,
      },
      ResultConfiguration: {
        OutputLocation: OUTPUT_LOCATION,
      },
    });

    const startResponse = await athenaClient.send(startCommand);
    const queryExecutionId = startResponse.QueryExecutionId;

    if (!queryExecutionId) {
      return { success: false, error: 'Failed to start query execution' };
    }

    // Wait for query to complete
    let queryStatus: QueryExecutionState | undefined;
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds timeout

    while (attempts < maxAttempts) {
      const getExecutionCommand = new GetQueryExecutionCommand({
        QueryExecutionId: queryExecutionId,
      });

      const executionResponse = await athenaClient.send(getExecutionCommand);
      queryStatus = executionResponse.QueryExecution?.Status?.State;

      if (queryStatus === QueryExecutionState.SUCCEEDED) {
        break;
      } else if (queryStatus === QueryExecutionState.FAILED || queryStatus === QueryExecutionState.CANCELLED) {
        return { 
          success: false, 
          error: executionResponse.QueryExecution?.Status?.StateChangeReason || 'Query failed' 
        };
      }

      // Wait 1 second before checking again
      await new Promise(resolve => setTimeout(resolve, 500));
      attempts++;
    }

    if (queryStatus !== QueryExecutionState.SUCCEEDED) {
      return { success: false, error: 'Query timeout' };
    }

    // Get query results
    const getResultsCommand = new GetQueryResultsCommand({
      QueryExecutionId: queryExecutionId,
    });

    const resultsResponse = await athenaClient.send(getResultsCommand);
    const rows = resultsResponse.ResultSet?.Rows || [];

    if (rows.length === 0) {
      return { success: true, data: [] };
    }

    // Parse results (first row is headers)
    const headers = rows[0].Data?.map(col => col.VarCharValue || '') || [];
    const data = rows.slice(1).map(row => {
      const obj: any = {};
      row.Data?.forEach((col, index) => {
        obj[headers[index]] = col.VarCharValue || '';
      });
      return obj;
    });

    return { success: true, data };
  } catch (error) {
    console.error('Athena query error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Query function logs from Athena
 */
export async function queryFunctionLogs(functionId: string, hoursBack: number = 3): Promise<AthenaQueryResult> {
  const query = `
    SELECT * FROM "${TABLE_NAME}" 
    WHERE function_id = '${functionId}'
      AND log IS NOT NULL 
      AND length(log) > 0
      AND date_parse(year || '-' || month || '-' || day, '%Y-%m-%d') >= current_date - INTERVAL '1' DAY
      AND from_iso8601_timestamp("timestamp") > now() - INTERVAL '${hoursBack}' HOUR
    ORDER BY "timestamp" DESC
    LIMIT 1000
  `;

  return executeAthenaQuery(query);
}
