const { Delivery } = require('./');

async function main() {
  const delivery = new Delivery({
    bucket: 'datadesk-delivery-demo',
    basePath: 'demo-2021-03',
    region: 'us-west-2',
  });

  const results = await delivery.uploadFiles('./src', { shouldCache: true });
  console.log(results);

  await delivery.downloadFiles('', 'demo');
}

main().catch(console.error);
