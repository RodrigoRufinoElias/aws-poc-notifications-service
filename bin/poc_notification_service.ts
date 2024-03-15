#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { NotificationAppStack } from "../lib/notificationApp-stack";
import { NotificationApiStack } from "../lib/notificationApi-stack";

const app = new cdk.App();

const env: cdk.Environment = {
  account: "098297762675",
  region: "us-east-1",
};

const tags = {
  cost: "NotificationServicePoc",
  team: "POC",
};

const notificationServiceStack = new NotificationAppStack(
  app,
  "NotificationApp",
  {
    tags: tags,
    env: env,
  }
);

const notificationApiStack = new NotificationApiStack(app, "NotificationApi", {
  notificationsHandler: notificationServiceStack.notificationsHandler,
  tags: tags,
  env: env,
});

notificationApiStack.addDependency(notificationServiceStack);
