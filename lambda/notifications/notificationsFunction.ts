import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import { SNS } from "aws-sdk";
import { EmailParams } from "../../models/Notifications";

// Client do SNS
const snsClient = new SNS();

// ARN do tópico obtido por variável de ambiente
const notificationsTopicArn = process.env.NOTIFICATIONS_TOPIC_ARN!;

export async function handler(
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  const lambdaRequestId = context.awsRequestId;
  const apiRequestId = event.requestContext.requestId;
  const method = event.httpMethod;

  console.log(
    `API Gateway RequestId: ${apiRequestId} - Lambda RequestId: ${lambdaRequestId}`
  );

  if (event.resource === "/notifications") {
    if (method === "POST") {
      const body = JSON.parse(event.body!) as EmailParams;
      const emailDestinatary = body.emailDestinatary;
      const emailMessage = body.emailMessage;

      const eventResult = await sendNotification(
        "NOTIFICATIONS_GET",
        emailDestinatary,
        emailMessage
      );

      return {
        statusCode: 200,
        body: JSON.stringify({
          message: `Notification sent - Message ID: ${eventResult.MessageId}`,
        }),
      };
    }
  }

  return {
    statusCode: 400,
    body: JSON.stringify({
      message: "Bad request",
    }),
  };
}

function sendNotification(
  eventType: string,
  emailDestinatary: string,
  emailMessage: string
) {
  const notificationData = {
    eventType,
    data: {
      emailDestinatary,
      emailMessage,
    },
  };

  return snsClient
    .publish({
      TopicArn: notificationsTopicArn,
      Message: JSON.stringify(notificationData),
    })
    .promise();
}
