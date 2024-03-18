import { SQSEvent, Context, SNSMessage } from "aws-lambda";
import { AWSError, SES } from "aws-sdk";
import { PromiseResult } from "aws-sdk/lib/request";
import { Notification, EmailParams } from "../../models/Notifications";

const sesClient = new SES();

export async function handler(
  event: SQSEvent,
  context: Context
): Promise<void> {
  const promises: Promise<PromiseResult<SES.SendEmailResponse, AWSError>>[] =
    [];

  event.Records.forEach((record) => {
    const body = JSON.parse(record.body) as SNSMessage;
    promises.push(sendEmail(body));
  });

  await Promise.all(promises);

  return;
}

function sendEmail(body: SNSMessage) {
  const notification = JSON.parse(body.Message) as Notification;
  const emailParams = notification.data as EmailParams;

  return sesClient
    .sendEmail({
      Destination: {
        ToAddresses: [emailParams.emailDestinatary],
      },
      Message: {
        Body: {
          Text: {
            Charset: "UTF-8",
            Data: emailParams.emailMessage,
          },
        },
        Subject: {
          Charset: "UTF-8",
          Data: "Teste com SES",
        },
      },
      Source: "rodrigo.rufino.elias@gmail.com",
      ReplyToAddresses: ["rodrigo.rufino.elias@gmail.com"],
    })
    .promise();
}
