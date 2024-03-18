export interface Notification {
  eventType: string;
  data: EmailParams;
}

export interface EmailParams {
  emailDestinatary: string;
  emailMessage: string;
}
