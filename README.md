https://honeyscreen.com

---

### Requirements

*   Node v8.3.0+ (Older versions will likely work but untested)

# Getting Started

Run the following commands in project root to get started

*   `npm i`
*   `npm run dlimages`

### Development

To run dev server for testing run:

*   `npm start`

You may set the `L10N` environment variable to view with different locales (`en` (default), `ko`, `ja`, `zh-tw`).

*   example: `L10N=ko npm start`

### Deployment

First set the `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` environment variables with proper keys for Honeyscreen. Then run:

*   `npm run deploy`

© 2018 [Buzzvil](https://www.buzzvil.com), shared under the [MIT license](https://opensource.org/licenses/MIT).
