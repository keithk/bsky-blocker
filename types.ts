export interface BlueskyCredentials {
  identifier: string; // email
  password: string; // app password from settings
}

export interface BlockPattern {
  namePattern?: RegExp;
  displayNamePattern?: RegExp;
  descriptionPattern?: RegExp;
  linksPattern?: RegExp;
}

export interface FollowerCheck {
  did: string;
  handle: string;
  checkedAt: Date;
  blocked: boolean;
  reason?: string;
}
