import lambdaTester from "lambda-tester";
import { createRequestHandler as createRemixRequestHandler } from "@remix-run/server-runtime";
import { Headers as NodeHeaders } from "@remix-run/node";

import {
  createRequestHandler,
  createRemixHeaders,
  createCloudFrontHeaders,
  createRemixRequest
} from "./adapter";

import type {
  CloudFrontRequestEvent,
  CloudFrontRequest,
  CloudFrontResultResponse
} from "aws-lambda";

jest.mock("@remix-run/server-runtime");
let mockedCreateRequestHandler =
  createRemixRequestHandler as jest.MockedFunction<
    typeof createRemixRequestHandler
  >;

function createMockEvent(
  request: Partial<CloudFrontRequest> = {}
): CloudFrontRequestEvent {
  const { body, headers, ...req } = request;
  return {
    Records: [
      {
        cf: {
          config: {
            distributionDomainName: "example.org",
            distributionId: "ABCDEFGHI123456",
            eventType: "origin-request",
            requestId: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
          },
          request: {
            body: {
              action: "read-only",
              data: "",
              encoding: "base64",
              inputTruncated: false,
              ...body
            },
            clientIp: "2a02:1810:cd37:7e00:5859:d882:d97b:7721",
            headers: {
              host: [
                {
                  key: "host",
                  value: "example.org"
                }
              ],
              ...headers
            },
            method: "GET",
            origin: {
              s3: {
                authMethod: "origin-access-identity",
                customHeaders: {},
                domainName: "mybucket.s3.us-east-1.amazonaws.com",
                path: "",
                region: "us-east-1"
              }
            },
            querystring: "",
            uri: "/",
            ...req
          }
        }
      }
    ]
  };
}

describe("createCloudFrontHeaders", () => {
  it("handles empty headers", () => {
    expect(createCloudFrontHeaders(new NodeHeaders())).toEqual({});
  });

  it("handles simple headers", () => {
    expect(
      createCloudFrontHeaders(new NodeHeaders({ "x-foo": "bar" }))
    ).toEqual({
      "x-foo": [
        {
          key: "x-foo",
          value: "bar"
        }
      ]
    });
  });

  it("handles multiple headers", () => {
    expect(
      createCloudFrontHeaders(
        new NodeHeaders({
          "x-foo": "bar",
          "x-bar": "baz"
        })
      )
    ).toEqual({
      "x-bar": [
        {
          key: "x-bar",
          value: "baz"
        }
      ],
      "x-foo": [
        {
          key: "x-foo",
          value: "bar"
        }
      ]
    });
  });

  it("handles headers with multiple values", () => {
    const headers = new NodeHeaders();
    headers.append("x-foo", "bar");
    headers.append("x-foo", "baz");

    expect(createCloudFrontHeaders(headers)).toEqual({
      "x-foo": [
        {
          key: "x-foo",
          value: "bar"
        },
        {
          key: "x-foo",
          value: "baz"
        }
      ]
    });
  });

  it("handles headers with multiple values and multiple headers", () => {
    const headers = new NodeHeaders();
    headers.append("x-foo", "bar");
    headers.append("x-foo", "baz");
    headers.append("x-bar", "baz");

    expect(createCloudFrontHeaders(headers)).toEqual({
      "x-bar": [
        {
          key: "x-bar",
          value: "baz"
        }
      ],
      "x-foo": [
        {
          key: "x-foo",
          value: "bar"
        },
        {
          key: "x-foo",
          value: "baz"
        }
      ]
    });
  });
});

describe("createRemixHeaders", () => {
  it("returns instance of 'Headers'", () => {
    expect(createRemixHeaders({})).toBeInstanceOf(Headers);
  });

  it("handles empty headers", () => {
    expect(createRemixHeaders({})).toMatchInlineSnapshot(`
        Headers {
          Symbol(map): Object {},
        }
      `);
  });

  it("handles simple headers", () => {
    expect(createRemixHeaders({ "x-foo": [{ key: "x-foo", value: "bar" }] }))
      .toMatchInlineSnapshot(`
        Headers {
          Symbol(map): Object {
            "x-foo": Array [
              "bar",
            ],
          },
        }
      `);
  });

  it("handles multiple headers", () => {
    expect(
      createRemixHeaders({
        "x-foo": [{ key: "x-foo", value: "bar" }],
        "x-bar": [{ key: "x-bar", value: "baz" }]
      })
    ).toMatchInlineSnapshot(`
        Headers {
          Symbol(map): Object {
            "x-bar": Array [
              "baz",
            ],
            "x-foo": Array [
              "bar",
            ],
          },
        }
      `);
  });

  it("handles headers with multiple values", () => {
    expect(
      createRemixHeaders({
        "x-foo": [
          { key: "x-foo", value: "bar" },
          { key: "x-foo", value: "baz" }
        ]
      })
    ).toMatchInlineSnapshot(`
        Headers {
          Symbol(map): Object {
            "x-foo": Array [
              "bar",
              "baz",
            ],
          },
        }
      `);
  });

  it("handles headers with multiple values and multiple headers", () => {
    expect(
      createRemixHeaders({
        "x-foo": [
          { key: "x-foo", value: "bar" },
          { key: "x-foo", value: "baz" }
        ],
        "x-bar": [{ key: "x-bar", value: "baz" }]
      })
    ).toMatchInlineSnapshot(`
        Headers {
          Symbol(map): Object {
            "x-bar": Array [
              "baz",
            ],
            "x-foo": Array [
              "bar",
              "baz",
            ],
          },
        }
      `);
  });
});

describe("createRemixRequest", () => {
  it("creates a request with the correct headers", () => {
    expect(
      createRemixRequest(
        createMockEvent({
          headers: {
            host: [{ key: "host", value: "example.org" }],
            cookie: [{ key: "cookie", value: "__session=value" }],
            "x-hello": [{ key: "x-hello", value: "world" }]
          }
        })
      )
    ).toMatchInlineSnapshot(`
      Request {
        "agent": undefined,
        "compress": true,
        "counter": 0,
        "follow": 20,
        "size": 0,
        "timeout": 0,
        Symbol(Body internals): Object {
          "body": null,
          "disturbed": false,
          "error": null,
        },
        Symbol(Request internals): Object {
          "headers": Headers {
            Symbol(map): Object {
              "cookie": Array [
                "__session=value",
              ],
              "host": Array [
                "example.org",
              ],
              "x-hello": Array [
                "world",
              ],
            },
          },
          "method": "GET",
          "parsedURL": Url {
            "auth": null,
            "hash": null,
            "host": "example.org",
            "hostname": "example.org",
            "href": "https://example.org/",
            "path": "/",
            "pathname": "/",
            "port": null,
            "protocol": "https:",
            "query": null,
            "search": null,
            "slashes": true,
          },
          "redirect": "follow",
          "signal": null,
        },
      }
    `);
  });
});

describe("createRequestHandler", () => {
  afterEach(() => {
    mockedCreateRequestHandler.mockReset();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it("handles requests", async () => {
    mockedCreateRequestHandler.mockImplementation(() => async req => {
      return new Response(`URL: ${new URL(req.url).pathname}`);
    });

    await lambdaTester(createRequestHandler({ build: undefined }))
      .event(createMockEvent({ uri: "/foo/bar" }))
      .expectResolve((res: CloudFrontResultResponse) => {
        expect(res.status).toBe("200");
        expect(res.body).toBe("URL: /foo/bar");
      });
  });

  it("handles null body", async () => {
    mockedCreateRequestHandler.mockImplementation(() => async () => {
      return new Response(null, { status: 200 });
    });

    await lambdaTester(createRequestHandler({ build: undefined }))
      .event(createMockEvent({ uri: "/foo/bar" }))
      .expectResolve((res: CloudFrontResultResponse) => {
        expect(res.status).toBe("200");
        expect(res.body).toBe("");
      });
  });

  it("handles status codes", async () => {
    mockedCreateRequestHandler.mockImplementation(() => async () => {
      return new Response("", { status: 204 });
    });

    await lambdaTester(createRequestHandler({ build: undefined }))
      .event(createMockEvent({ uri: "/foo/bar" }))
      .expectResolve((res: CloudFrontResultResponse) => {
        expect(res.status).toBe("204");
        expect(res.body).toBe("");
      });
  });

  it("sets headers", async () => {
    mockedCreateRequestHandler.mockImplementation(() => async () => {
      let headers = new Headers();
      headers.append("x-time-of-year", "most wonderful");
      headers.append(
        "set-cookie",
        "first=one; Expires=0; Path=/; HttpOnly; Secure; SameSite=Lax"
      );
      headers.append(
        "set-cookie",
        "second=two; MaxAge=1209600; Path=/; HttpOnly; Secure; SameSite=Lax"
      );
      headers.append(
        "set-cookie",
        "third=three; Expires=Wed, 21 Oct 2015 07:28:00 GMT; Path=/; HttpOnly; Secure; SameSite=Lax"
      );

      return new Response("", { headers });
    });

    await lambdaTester(createRequestHandler({ build: undefined }))
      .event(createMockEvent({ uri: "/" }))
      .expectResolve((res: CloudFrontResultResponse) => {
        expect(res.status).toBe("200");
        expect(res.body).toBe("");
        expect(res.headers["x-time-of-year"]).toEqual([
          { key: "x-time-of-year", value: "most wonderful" }
        ]);
        expect(res.headers["set-cookie"]).toEqual([
          {
            key: "set-cookie",
            value:
              "first=one; Expires=0; Path=/; HttpOnly; Secure; SameSite=Lax"
          },
          {
            key: "set-cookie",
            value:
              "second=two; MaxAge=1209600; Path=/; HttpOnly; Secure; SameSite=Lax"
          },
          {
            key: "set-cookie",
            value:
              "third=three; Expires=Wed, 21 Oct 2015 07:28:00 GMT; Path=/; HttpOnly; Secure; SameSite=Lax"
          }
        ]);
      });
  });

  it("calls getLoadContext", async () => {
    mockedCreateRequestHandler.mockImplementation(() => async () => {
      return new Response("");
    });

    const mockGetLoadContent = jest.fn();
    const mockEvent = createMockEvent({ uri: "/" });

    await lambdaTester(
      createRequestHandler({
        build: undefined,
        getLoadContext: mockGetLoadContent
      })
    )
      .event(mockEvent)
      .expectResolve((res: CloudFrontResultResponse) => {
        expect(mockGetLoadContent).toHaveBeenCalledWith(mockEvent);
        expect(res.status).toBe("200");
        expect(res.body).toBe("");
      });
  });
});
