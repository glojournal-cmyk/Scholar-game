(function(){
'use strict';
function normalise(v){
  return String(v??'')
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .toLowerCase().replace(/[’]/g,"'")
    .replace(/[.,!?;:()"]/g,' ')
    .replace(/\s+/g,' ').trim();
}
function mark(marking,input,selected){
  const value = selected || input || '';
  const accepted = Array.isArray(marking?.accepted) ? marking.accepted : [];
  const ok = accepted.some(a => normalise(a) === normalise(value));
  return {correct:ok, reason: ok ? 'Correct.' : 'Check the taught answer and try again.'};
}
window.FrenchReferenceMarker={normalise,mark};
})();