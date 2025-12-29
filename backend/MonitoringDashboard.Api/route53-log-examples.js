// Example Route53 Query Log Formats for Testing

// JSON Format (newer format)
const jsonLogExample = {
  "timestamp": "2024-01-15T10:30:45.123Z",
  "srcaddr": "203.0.113.12",
  "query_name": "example.com.",
  "query_type": "A",
  "responseCode": "NOERROR",
  "srcport": "53281"
};

// Space-separated format (legacy format)
const legacyLogExample = "2024-01-15T10:30:45.123Z 203.0.113.12 example.com. A NOERROR IAD89";

// Expected parsed output
const expectedOutput = {
  timestamp: "2024-01-15T10:30:45.123Z",
  sourceIp: "203.0.113.12",
  queryName: "example.com.",
  queryType: "A",
  responseCode: "NOERROR",
  edgeLocation: "Edge-532" // or "IAD89" for legacy format
};

// Common DNS query types
const dnsQueryTypes = [
  "A",      // IPv4 address
  "AAAA",   // IPv6 address
  "CNAME",  // Canonical name
  "MX",     // Mail exchange
  "NS",     // Name server
  "PTR",    // Pointer
  "SOA",    // Start of authority
  "TXT"     // Text
];

// Common response codes
const responseCodes = [
  "NOERROR",   // No error
  "NXDOMAIN",  // Domain does not exist
  "SERVFAIL",  // Server failure
  "REFUSED",   // Query refused
  "FORMERR"    // Format error
];