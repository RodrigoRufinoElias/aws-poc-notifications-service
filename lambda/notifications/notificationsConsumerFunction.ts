import { SNSEvent, SNSMessage, Context } from "aws-lambda";

export async function handler(
  event: SNSEvent,
  context: Context
): Promise<void> {
  event.Records.forEach((record) => {
    console.log("Notification message: ", record.Sns.Message);
  });

  return;
}
