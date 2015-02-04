/**********************************************************************
 * Author: S. Chasins
 **********************************************************************/

utilities.listenForMessage("mainpanel", "content", "URLs", checkURLs);
utilities.sendMessage("content", "mainpanel", "requestURLs", {});

function checkURLs(urls){
  console.log("urls: ",urls);
  var current_url = document.URL;
  for (var i = 0; i<urls.length; i++){
    if (urls[i]===current_url){
      var frame_id = SimpleRecord.getFrameId();
      if (frame_id === null){
        setTimeout(function(){checkURLs(urls);},500);
        return;
      }
      var data = {url: current_url, frame_id: frame_id};
      utilities.sendMessage("content", "mainpanel", "runScript", data);
    }
  }
}

$(function(){
  additional_recording_handlers_on["frame_id"] = true;
  additional_recording_handlers["frame_id"] = function(node){
    return SimpleRecord.getFrameId();
  };
});