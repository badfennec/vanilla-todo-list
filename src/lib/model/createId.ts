/**
 * Generates a random id (UUID v4). `isTaken` lets the caller exclude ids already in use, so a generated id
 * can never clash with one provided by the consumer.
 */
export function createId(isTaken: (id: string) => boolean = () => false): string {
  let id: string;

  do {
    id = crypto.randomUUID();
  } while (isTaken(id));

  return id;
}
