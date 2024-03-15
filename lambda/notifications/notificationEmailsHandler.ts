import { SQSEvent, Context } from "aws-lambda";

export async function handler(
  event: SQSEvent,
  context: Context
): Promise<void> {
  event.Records.forEach((record) => {
    const body = JSON.parse(record.body);
    console.log("Record: ", record);
    console.log("Body: ", body);
  });

  return;
}
