import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import { SNS } from "aws-sdk";

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
    if (method === "GET") {
      const eventResult = await sendNotification(
        "NOTIFICATIONS_GET",
        lambdaRequestId
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

function sendNotification(eventType: string, lambdaRequestId: string) {
  const notificationData = {
    eventType,
    data: {
      message: "Testando",
      lambdaRequestId,
    },
  };

  return snsClient
    .publish({
      TopicArn: notificationsTopicArn,
      Message: JSON.stringify(notificationData),
    })
    .promise();
}
