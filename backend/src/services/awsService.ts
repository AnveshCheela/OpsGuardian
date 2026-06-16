import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

// Ensure region is set from ENV, default to us-east-1
const region = process.env.AWS_REGION || 'us-east-1';

const s3Client = new S3Client({ region });
const lambdaClient = new LambdaClient({ region });

/**
 * Triggers the Mock Log Generator Lambda in AWS.
 * Returns the Bucket Name and S3 Object Key of the generated log.
 */
export const invokeLogGeneratorLambda = async () => {
  const command = new InvokeCommand({
    FunctionName: 'OpsGuardianLogGenerator', // The name of the lambda we created
    Payload: Buffer.from(JSON.stringify({ triggeredBy: 'OpsGuardianBackend' })),
  });

  const response = await lambdaClient.send(command);
  
  if (!response.Payload) {
    throw new Error('Lambda returned empty payload');
  }

  // Parse the Lambda response payload
  const payloadString = Buffer.from(response.Payload).toString('utf-8');
  const result = JSON.parse(payloadString);

  if (result.statusCode !== 200) {
    throw new Error(`Lambda execution failed: ${result.body}`);
  }

  const data = JSON.parse(result.body);
  return {
    bucket: data.bucket,
    key: data.key
  };
};

/**
 * Fetches a text log file directly from S3.
 */
export const fetchLogFromS3 = async (bucket: string, key: string): Promise<string> => {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  const response = await s3Client.send(command);
  
  if (!response.Body) {
    throw new Error('S3 Object body is empty');
  }

  // AWS SDK v3 returns a stream for the Body. We need to convert it to a string.
  const str = await response.Body.transformToString('utf-8');
  return str;
};
