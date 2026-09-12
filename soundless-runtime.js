(function(){
'use strict';
try{
  const proto=window.HTMLMediaElement&&window.HTMLMediaElement.prototype;
  if(proto){
    Object.defineProperty(proto,'play',{configurable:true,writable:true,value:function(){
      try{this.muted=true;this.volume=0;this.pause?.();}catch{}
      return Promise.resolve();
    }});
  }
}catch{}
document.addEventListener('play',event=>{
  const media=event.target;
  if(media instanceof HTMLMediaElement){
    try{media.muted=true;media.volume=0;media.pause();}catch{}
  }
},true);
})();
