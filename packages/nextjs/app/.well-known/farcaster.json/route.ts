import { minikitConfig } from "../../../minikit.config";
import { withValidManifest } from "@coinbase/onchainkit/minikit";

export async function GET() {
  return Response.json(withValidManifest(minikitConfig));
}
