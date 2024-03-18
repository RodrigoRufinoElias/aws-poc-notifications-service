import { SQSEvent, Context, SNSMessage } from "aws-lambda";
import { AWSError, SES } from "aws-sdk";
import { PromiseResult } from "aws-sdk/lib/request";

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
  return sesClient
    .sendEmail({
      Destination: {
        ToAddresses: ["rodrigo.elias@encora.com"],
      },
      Message: {
        Body: {
          Text: {
            Charset: "UTF-8",
            Data: "Teste de envio de email!",
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
