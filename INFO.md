## deploy contract

yarn

yarn account:import

yarn deploy --network baseSepolia
yarn deploy --network baseSepolia --tags SimpleConfidentialNFT

## CCIP Contracts for crosschain donation

https://github.com/aeither/ccip-starter-kit-foundry

## domain 

https://rescuedao-miniapp-nextjs.vercel.app/

## notification

curl -X POST http://localhost:3000/api/notifications/send \
  -H "Content-Type: application/json" \
  -d '{
    "targetFids": [],
    "notification": {
      "title": "Hello from RescueDAO!",
      "body": "Check out our latest update",
      "target_url": "https://rescuedao-miniapp-nextjs.vercel.app/"
    }
  }'

## features

miniapp: base connect, share, profile, notification, 