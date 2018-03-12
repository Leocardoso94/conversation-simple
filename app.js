

const express = require('express');
const bodyParser = require('body-parser');
const Conversation = require('watson-developer-cloud/conversation/v1'); // watson sdk
const TextToSpeechV1 = require('watson-developer-cloud/text-to-speech/v1');

const app = express();

// Bootstrap application settings
app.use(express.static('./public')); // load UI from public folder
app.use(bodyParser.json());

const getFileExtension = (acceptQuery) => {
  const accept = acceptQuery || '';
  switch (accept) {
    case 'audio/ogg;codecs=opus':
    case 'audio/ogg;codecs=vorbis':
      return 'ogg';
    case 'audio/wav':
      return 'wav';
    case 'audio/mpeg':
      return 'mpeg';
    case 'audio/webm':
      return 'webm';
    case 'audio/flac':
      return 'flac';
    default:
      return 'mp3';
  }
};


const textToSpeech = new TextToSpeechV1({
  // If unspecified here, the TEXT_TO_SPEECH_USERNAME and
  // TEXT_TO_SPEECH_PASSWORD env properties will be checked
  // After that, the SDK will fall back to the bluemix-provided VCAP_SERVICES environment property
  // username: '<username>',
  // password: '<password>',
});


// Create the service wrapper
const conversation = new Conversation({
  // If unspecified here, the CONVERSATION_USERNAME and CONVERSATION_PASSWORD env properties will be checked
  // After that, the SDK will fall back to the bluemix-provided VCAP_SERVICES environment property
  // 'username': process.env.CONVERSATION_USERNAME,
  // 'password': process.env.CONVERSATION_PASSWORD,
  version_date: '2017-05-26',
});

function updateMessage(input, response) {
  let responseText = null;
  if (!response.output) {
    response.output = {};
  } else {
    return response;
  }
  if (response.intents && response.intents[0]) {
    const intent = response.intents[0];
    // Depending on the confidence of the response the app can return different messages.
    // The confidence will vary depending on how well the system is trained. The service will always try to assign
    // a class/intent to the input. If the confidence is low, then it suggests the service is unsure of the
    // user's intent . In these cases it is usually best to return a disambiguation message
    // ('I did not understand your intent, please rephrase your question', etc..)
    if (intent.confidence >= 0.75) {
      responseText = `I understood your intent was ${intent.intent}`;
    } else if (intent.confidence >= 0.5) {
      responseText = `I think your intent was ${intent.intent}`;
    } else {
      responseText = 'I did not understand your intent';
    }
  }
  response.output.text = responseText;
  return response;
}

// Endpoint to be call from the client side
app.post('/api/message', (req, res) => {
  const workspace = process.env.WORKSPACE_ID || '<workspace-id>';
  if (!workspace || workspace === '<workspace-id>') {
    return res.json({
      output: {
        text: 'The app has not been configured with a <b>WORKSPACE_ID</b> environment variable. Please refer to the ' + '<a href="https://github.com/watson-developer-cloud/conversation-simple">README</a> documentation on how to set this variable. <br>' + 'Once a workspace has been defined the intents may be imported from ' + '<a href="https://github.com/watson-developer-cloud/conversation-simple/blob/master/training/car_workspace.json">here</a> in order to get a working application.',
      },
    });
  }
  const payload = {
    workspace_id: workspace,
    context: req.body.context || {},
    input: req.body.input || {},
  };

  // Send the input to the conversation service
  return conversation.message(payload, (err, data) => {
    if (err) {
      return res.status(err.code || 500).json(err);
    }
    return res.json(updateMessage(payload, data));
  });
});

/**
 * Pipe the synthesize method
 */
app.get('/api/synthesize', (req, res, next) => {
  req.query.voice = 'pt-BR_IsabelaVoice';
  req.query.download = 'true';
  req.query.accept = 'audio/mp3';


  const transcript = textToSpeech.synthesize(req.query);
  transcript.on('response', (response) => {
    if (req.query.download) {
      response.headers['content-disposition'] = `attachment; filename=transcript.${getFileExtension(req.query.accept)}`;
    }
  });
  transcript.on('error', next);
  transcript.pipe(res);
});


module.exports = app;
