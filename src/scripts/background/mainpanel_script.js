var all_scripts = [];
function setUp(){

  utilities.listenForMessage("content", "mainpanel", "requestURLs",function(){utilities.sendMessage("mainpanel","content","URLs", _.pluck(all_scripts,"url"));});
  utilities.listenForMessage("content", "mainpanel", "runScript", runScript);

  $("button").button();	
  $("#start_recording").click(startRecording);
  $("#done_recording").click(doneRecording);
  $("#make_new_string_param").click(makeNewStringParam);

  chrome.storage.local.get("all_scripts", function(obj){
    var asr = JSON.parse(obj.all_scripts);
    if (!asr){
      asr = [];
    }
    all_scripts = asr;
    showScripts(all_scripts);
  });
}

$(setUp);

function showScripts(scriptsList){
  var scriptsDiv = $("#scripts");
  scriptsDiv.html("");
  for (var i = 0; i<scriptsList.length; i++){
    (function(){
      var script = scriptsList[i];
      var url = script.url;
      var newDiv = $('<div>'+url+'</div>');
      newDiv.click(function(){editScript(script);});
      console.log(scriptsDiv);
      scriptsDiv.append(newDiv);
      console.log(scriptsDiv);
    })(); //fake block scope
  }
  console.log(scriptsDiv);
}

var currently_edited_script = null;
function editScript(script){
  currently_edited_script = script;
  document.getElementById("editing_controls").style.display = "inherit";
  displayScriptParameters(script);
}

function displayScriptParameters(script){
  var params = script.params;
  var paramsDiv =  $("#string_parameters").html("");
  for (var i = 0; i<params.length; i++){
    var param = params[i];
    var newDiv = $('<div>'+param.name+': <input type="text" class="stringParamName" id="'+param.name+'" placeholder="'+param.curr_value+'"><button class="update_params">Update</button></div>');
    paramsDiv.append(newDiv);
  }
  $(".update_params").click(updateParameters);
}

function makeNewStringParam(){
  var name = $("#newStringParamName").val();
  var original_value = $("#originalString").val();
  console.log(name, original_value);
  currently_edited_script.params.push({name:name,curr_value:""});
  currently_edited_script.parameterized_trace.parameterizeTypedString(name, original_value);
  displayScriptParameters(currently_edited_script); //show the new param which now needs to be set
}

function updateParameters(){
  var paramsDivs =  $(".stringParamName").html("");
  console.log(paramsDivs);
  var params = [];
  for (var i = 0; i<paramsDivs.length; i++){
    var paramDiv = $(paramsDivs[i]);
    console.log(paramDiv);
    var name = paramDiv.attr('id');
    console.log(name);
    var new_value = paramDiv.val();
    params.push({name:name,curr_value:new_value});
    currently_edited_script.parameterized_trace.useTypedString(name, new_value);
  }
  currently_edited_script.params = params;
}

function runScript(msg){
  var url = msg.url;
  for (var i = 0; i<all_scripts.length; i++){
    if (all_scripts[i].url === url){
      console.log(url);
      var parameterized_trace = all_scripts[i].parameterized_trace;
      console.log(parameterized_trace.getConfig());
      parameterized_trace.useFrame("frame", msg.frame_id);
      var standard_trace = parameterized_trace.getStandardTrace();
      var config = parameterized_trace.getConfig();
      console.log(standard_trace,config);
      SimpleRecord.replay(standard_trace, config);
      console.log("replayed");
      return;
    }
  }
}

function startRecording(){
  SimpleRecord.startRecording();
}

function doneRecording(){
  var trace = SimpleRecord.stopRecording();
  trace = sanitizeTrace(trace);
  console.log(trace);
  var parameterized_trace = new ParameterizedTrace(trace);
  var filtered_trace = _.filter(trace, function(obj){return obj.type === "dom";});
  parameterized_trace.parameterizeFrame("frame", filtered_trace[0].additional.frame_id);
  var script = {};
  script.params = [];
  script.url = filtered_trace[0].frame.URL;
  console.log("think url is: "+script.url);
  script.parameterized_trace = parameterized_trace;
  console.log(parameterized_trace);
  all_scripts.push(script);
  var data = {"all_scripts":JSON.stringify(all_scripts)};
  chrome.storage.local.set(data);
  showScripts(all_scripts); //update the display now that we have a new one
}

function sanitizeTrace(trace){
  return _.filter(trace, function(obj){return obj.state !== "stopped";});
}

