/*
 * Copyright (c) 2015 Samsung Electronics Co., Ltd.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 * * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 * * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 * * Neither the name of Samsung Electronics Co., Ltd. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

/**
 * Creates a SAP socket and accepts an incoming connection.
 * @appName         {String} appName Application peerAgent name.
 * @onFileTransfer  {Function} onFileTransfer Method executed after socket successful connection with SAFileTransfer as argument.
 * @onerror         {Function} onerror Method executed after socket connection failure with error code as argument.
 */
function SAServerOpen(appName, onFileTransfer, onerror) {
    'use strict';
    webapis.sa.requestSAAgent(function(agents) {
        if(agents.length > 0) {
            var SAAgent = agents[0];

            SAAgent.setServiceConnectionListener({
                onrequest : function(peerAgent) {
                    if(peerAgent.appName == appName) {
                        SAAgent.acceptServiceConnectionRequest(peerAgent);
                    } else {
                        SAAgent.rejectServiceConnectionRequest(peerAgent);
                    }
                },
                onconnect : function(socket) {
                    socket.setSocketStatusListener(function(reason) {
                        socket.close();
                    });
                    var hintcontent = document.getElementById("hint-content");
                    hintcontent.textContent = TIZEN_L10N['phone_connected'];
                    showNote("onconnect");
                    socket.setDataReceiveListener(onreceive);
                },
                onerror : onerror
            });
            
            onFileTransfer(SAAgent.getSAFileTransfer());           
         }
    });
}

function onreceive(channelId, data) {
	console.log("Data Received: " + data);
	localStorage.setItem("receiveRouteName", data);
}

/**
 * Creates a gui and accepts file connections.
 * @SAFileTransfer  {SAFileTransfer} File Transfer object between a Service Provider and Service Consumer.
 */
function onFileTransfer(SAFileTransfer) {
    'use strict';
    var content = document.getElementById("file-content");
    var progress = document.getElementById("file-progress");
    var ratio = document.getElementById("file-ratio");
    var name = document.getElementById("file-name");
    var button = document.getElementById("file-button");

    SAFileTransfer.setFileReceiveListener({
        onreceive : function(id, fileName) {
   //         var receive = confirm(TIZEN_L10N['want_receive_file'] + ": " + fileName + "?");
   //         if (receive === true) {
                progress.value = 0;
                name.innerHTML = fileName;
                ratio.innerHTML = "0%";

                content.classList.remove("hidden");

                button.onclick = function() {
                    try {
                        SAFileTransfer.cancelFile(id);
                        content.classList.add("hidden");
                    } catch(err) {
                        content.classList.add("hidden");
                        showNote("peeragent_no_response");
                    }
                };
                try {
                	SAFileTransfer.receiveFile(id, 'documents/' + fileName);
                } catch(e) {
                	content.classList.add("hidden");
                	showNote("unknown_error");
                }
                
  //          } else {
  //              SAFileTransfer.rejectFile(id);
  //          }
        },
        onprogress : function(id, value) {
            progress.value = value;
            ratio.innerHTML = value + "%";
        },
        oncomplete : function(id, localPath) {
            content.classList.add("hidden");
            showNote("oncomplete");
            console.log("path: " + localPath);
            localStorage.setItem("receiveFilePath", localPath); 
            window.location.href = "addfile.html";
        },
        onerror : onerror
    });
}

/**
 * Shows element, which contains message.
 * @id  {String} Element id.
 */
function showNote(id) {
    'use strict';
    var note = document.getElementById("msg-" + id.toLocaleLowerCase());
    note.classList.add("show");
}

/**
 * Shows message based on error code.
 * @error   {String} Error code.
 */
function onerror(error) {
    'use strict';
    var content = document.getElementById("file-content");
    content.classList.add("hidden");

    showNote(error);
}

window.onload = function() {
    'use strict';
    
	for (var i = 0; i < document.querySelectorAll('[data-l10n]').length; i++) {
	    var elem = document.querySelectorAll('[data-l10n]')[i];
	    elem.innerHTML = TIZEN_L10N[elem.getAttribute('data-l10n')];
	}

    document.addEventListener('tizenhwkey', function(event) {
        if(event.keyName == "back")
        	window.history.back();
//            tizen.application.getCurrentApplication().exit();
    });

    document.addEventListener("webkitAnimationEnd", function(event) {
        var element = event.srcElement;
        if(element.classList.contains("show")) {
            element.classList.remove("show");
        }
    });

    try {
        SAServerOpen("FileTransferSender", onFileTransfer, onerror);
    } catch(error) {
        console.log("FileTransferReceiver: " + error.name + "( " + error.message + " )");
    }
    
    // The following code example launches a specific application explicitly with the package name and application name.
    var remoteAppControlReplyCallback = {
        // callee sent a reply
        onsuccess: function(data) {
            console.log('Received data is ' + data);
        },
        // callee returned failure
        onfailure: function() {
            console.log('The launch remote application control failed');
        }
    }

    var appControl =
          new webapis.RemoteApplicationControl(
                     "http://samsung.com/appcontrol/operation/remote/default",
                     null,
                     "com.biamsolution.android.gpxroutetracker.filesender",
                     "com.biamsolution.android.gpxroutetracker.filesender.FileTransferSenderActivity",
                     "Test Message");

    webapis.remoteappcontrol.launchRemoteAppControl(
        appControl,
        function() {console.log("launch remote application control succeed");},
        function(e) {console.log("launch remote application control failed. reason: " + e.name);},
        remoteAppControlReplyCallback);
    
};
