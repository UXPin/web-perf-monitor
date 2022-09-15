# web-perf-monitor (Work in Progress)

A simple project to automate the generation of reports about web performance for the following apps:

- Dashboard
- Editor
- Preview

It uses [Puppeteer](https://pptr.dev/) to generate reports using [Lighthouse](https://developer.chrome.com/docs/lighthouse/overview/)

## Running it

This will run Lighthouse against some URLs and display the performance score

```
npx ts-node --esm ./src/get-scores-simple.ts
```

