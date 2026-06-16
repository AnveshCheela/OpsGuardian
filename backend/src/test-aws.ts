import { invokeLogGeneratorLambda, fetchLogFromS3 } from './services/awsService';
import { analyzeLogWithGemini } from './services/aiService';

const runTest = async () => {
  console.log('1. Invoking Lambda...');
  try {
    const { bucket, key } = await invokeLogGeneratorLambda();
    console.log(`Success! Log generated at s3://${bucket}/${key}`);
    
    console.log('2. Fetching from S3...');
    const logContent = await fetchLogFromS3(bucket, key);
    console.log(`Success! Log content: ${logContent.substring(0, 100)}...`);

    console.log('3. Sending to Gemini...');
    const aiResult = await analyzeLogWithGemini(logContent);
    console.log(`Success! AI Result:`, aiResult);

  } catch (error) {
    console.error('Test Failed:', error);
  }
};

runTest();
