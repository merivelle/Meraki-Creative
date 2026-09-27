import "server-only";

/**
 * E-signature boundary. Today the only implementation is an external link: the studio
 * uploads the agreement, pastes the signing service's link, and records the signed status
 * manually (with a reason, in the audit log). No signing provider is integrated yet.
 *
 * To add one (Dropbox Sign, DocuSign, …): implement `SigningProvider`, add a webhook route
 * under /api/webhooks/<provider> that VERIFIES the provider's signature, and let only that
 * route set agreements.status_source = 'provider'.
 */
export interface SigningProvider {
  readonly id: string;
  isConfigured(): boolean;
  createSigningRequest?(input: { agreementId: string; fileUrl: string; signerEmail: string; signerName: string }): Promise<{ providerRef: string; signingUrl: string }>;
}

export const externalLinkSigning: SigningProvider = {
  id: "external",
  isConfigured: () => true,
};
