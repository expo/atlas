import { getSource } from '~/utils/atlas';

export async function GET() {
  return Response.json(await getSource().listEntries());
}
