const { Delivery } = require('./dist');

async function main() {
  const delivery = new Delivery({
    bucket: 'datadesk-delivery-demo',
    basePath: 'example',
  });

  delivery.on('upload', console.log);
  delivery.on('upload:all', console.log);

  await delivery.uploadFiles('./example', {
    shouldCache: true,
  });
}

main().catch(console.error);
