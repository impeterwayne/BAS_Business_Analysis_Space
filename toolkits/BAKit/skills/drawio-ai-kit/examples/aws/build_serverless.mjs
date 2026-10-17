// Serverless web app with a numbered request walkthrough — type "sequence".
// Layout engine: NO hardcoded coords. Static path (S3+CloudFront) and dynamic path (API GW→Lambda→DynamoDB).
import { writeFileSync } from "node:fs";
import { Diagram } from "../../src/builder.mjs";
import { group, frame, icon, box, phantom, renderTree } from "../../src/layout-engine.mjs";

const d = new Diagram("sequence");

const tree = phantom("root", "", { dir: "row", gap: 80, align: "center", header: 0, pad: 10 }, [
  box("browser", "Browser", { w: 120, h: 60, fill: "#DAE8FC", stroke: "#6C8EBF", bold: true }),
  phantom("paths", "", { dir: "col", gap: 60, header: 0 }, [
    frame("static", "Static content path", { dir: "row", gap: 50, fill: "#FFFFFF", stroke: "#999999" }, [
      icon("r53", "route_53", "Route 53"),
      icon("cf", "cloudfront", "CloudFront"),
      icon("acm", "certificate_manager", "Certificate Manager"),
      icon("s3", "s3", "S3 (static files)"),
    ]),
    frame("dynamic", "Dynamic API path", { dir: "row", gap: 50, fill: "#FFFFFF", stroke: "#999999" }, [
      icon("apigw", "api_gateway", "API Gateway"),
      icon("lambda", "lambda", "Lambda"),
      icon("ddb", "dynamodb", "DynamoDB"),
    ]),
  ]),
]);

renderTree(d, tree, [40, 80]);
d.title("Serverless web app — type: sequence (numbered request walkthrough)");

d.link("browser", "r53", "1 · resolve example.com");
d.link("r53", "cf", "2 · route");
d.link("cf", "acm", "3 · TLS cert");
d.link("cf", "s3", "4 · fetch assets");
d.link("browser", "apigw", "5 · API call");
d.link("apigw", "lambda", "6 · invoke");
d.link("lambda", "ddb", "7 · read/write");

const res = d.validate();
console.log("VALIDATE:", JSON.stringify({ ok: res.ok, errors: res.errors, warnings: res.warnings, advice: res.audit.advice }));
writeFileSync(new URL("../../out/serverless_kit.drawio", import.meta.url), d.mxfile("Serverless web (sequence)"));
