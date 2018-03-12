
/* global ConversationPanel: true, PayloadPanel: true */
/* eslint no-unused-vars: "off" */

// Other JS files required to be loaded first: apis.js, conversation.js, payload.js
(function () {
  // Initialize all modules
  ConversationPanel.init();
  const input = document.getElementById('textInput');
  console.log(input)
  input.addEventListener('keydown', function (event) {
    ConversationPanel.inputKeyDown(event, this);
  });
  PayloadPanel.init();
}());
