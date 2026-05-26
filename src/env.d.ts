/// <reference path="../.astro/types.d.ts" />
declare namespace App {
  interface Locals {
    user?: import("@sentinel/types").PortalUser;
    nonce?: string;
    csrfToken?: string;
  }
}

declare var process: any;
