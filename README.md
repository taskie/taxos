# taxos

handmade Swagger code generator for TypeScript + axios

## usage

```bash
curl -LO https://github.com/taskie/taxos/releases/download/v0.1.0/taxos-0.1.0.js
curl -LO https://petstore.swagger.io/v2/swagger.json
echo '{"swaggerPath": "swagger.json", "apiName": "petstore"}' >petstore.taxos.json
node taxos-0.1.0.js -c petstore.taxos.json
# npx eslint --fix src/api/petstore/**/*.ts
```

## license

Apache License 2.0
