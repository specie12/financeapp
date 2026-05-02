import { SetMetadata } from '@nestjs/common'

/**
 * Marks a route as not subject to household-resource ownership enforcement.
 *
 * Use ONLY when:
 *   - the route's path parameter is not a household-owned resource ID
 *     (e.g. a public ticker symbol, a sector slug), OR
 *   - the route accepts resource IDs in the request body and the service
 *     layer enforces household ownership defensively.
 *
 * This decorator does NOT bypass authentication or permission checks.
 * It only opts the route out of the path-param ownership check.
 */
export const PUBLIC_RESOURCE_KEY = 'public_resource'
export const PublicResource = () => SetMetadata(PUBLIC_RESOURCE_KEY, true)
