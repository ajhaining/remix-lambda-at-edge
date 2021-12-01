# Remix Adapter for CloudFront Lambda@Edge

This adapter transforms [CloudFront Origin Request Events](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/lambda-event-structure.html#example-origin-request) into [Web Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) Request and Response objects using the [adapter convention](https://remix.run/docs/en/v1/other-api/adapter) set out in the Remix Docs.
