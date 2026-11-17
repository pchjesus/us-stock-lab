import {practiceMissions,type MissionId} from './learningPractice';
import {learningUnits,type LearningUnit} from './learningFoundation';
import {a2Units} from './learningA2';
import {p2Units} from './learningA2P2';
import {p3Units} from './learningA2P3';

export const learningUnitsById:Record<MissionId,LearningUnit>={...learningUnits,...a2Units,...p2Units,...p3Units};
export const learningIds=Object.keys(practiceMissions) as MissionId[];
const version=1;
const prefix='us-stock-lab.learning-progress.v1.';
export interface LearningProgress{
 version:1;
 completed:MissionId[];
 lastLesson:MissionId|null;
 answers:Partial<Record<MissionId,Record<string,string>>>;
}
export function emptyLearningProgress():LearningProgress{return {version,completed:[],lastLesson:null,answers:{}};}
const validId=(id:unknown):id is MissionId=>typeof id==='string'&&Object.prototype.hasOwnProperty.call(practiceMissions,id);
export function progressKey(uid:string|null){return prefix+(uid?'user.'+encodeURIComponent(uid):'guest');}
function safeRecord(raw:unknown):Record<string,unknown>{return raw!==null&&typeof raw==='object'&&!Array.isArray(raw)?raw as Record<string,unknown>:{};}
export function parseLearningProgress(raw:string|null):LearningProgress{
 if(!raw||raw.length>80_000)return emptyLearningProgress();
 try{
  const doc=safeRecord(JSON.parse(raw));if(doc.version!==1)return emptyLearningProgress();
  const completed=Array.isArray(doc.completed)?Array.from(new Set(doc.completed.filter(validId))):[];
  const lastLesson=validId(doc.lastLesson)?doc.lastLesson:null;
  const stored=safeRecord(doc.answers);
  const answers:LearningProgress['answers']={};
  for(const id of learningIds){
   const entry=safeRecord(stored[id]);const current:Record<string,string>={};
   for(const question of learningUnitsById[id].questions){
    const selected=entry[question.question];
    if(typeof selected==='string'&&question.options.some(o=>o.text===selected))current[question.question]=selected;
   }
   if(Object.keys(current).length)answers[id]=current;
  }
  return {version,completed,lastLesson,answers};
 }catch{return emptyLearningProgress();}
}
export function loadLearningProgress(uid:string|null):LearningProgress{
 try{return parseLearningProgress(localStorage.getItem(progressKey(uid)));}catch{return emptyLearningProgress();}
}
export function saveLearningProgress(uid:string|null,next:LearningProgress):boolean{
 try{localStorage.setItem(progressKey(uid),JSON.stringify(next));return true;}catch{return false;}
}
export function deleteLearningProgress(uid:string|null):boolean{
 try{localStorage.removeItem(progressKey(uid));return true;}catch{return false;}
}
export function visitLesson(doc:LearningProgress,id:MissionId):LearningProgress{return {...doc,lastLesson:id};}
export function setLessonCompletion(doc:LearningProgress,id:MissionId,completed:boolean):LearningProgress{
 return {...doc,completed:completed?Array.from(new Set([...doc.completed,id])):doc.completed.filter(x=>x!==id),lastLesson:id};
}
export function answerLessonQuestion(doc:LearningProgress,id:MissionId,question:string,option:string):LearningProgress{
 const q=learningUnitsById[id].questions.find(q=>q.question===question);
 if(!q||!q.options.some(o=>o.text===option))return doc;
 return {...doc,lastLesson:id,answers:{...doc.answers,[id]:{...doc.answers[id],[question]:option}}};
}
export function learningProgressStats(doc:LearningProgress){
 let answered=0,correct=0,total=0;
 const wrong:{id:MissionId;question:string;selected:string}[]=[];
 for(const id of learningIds){for(const q of learningUnitsById[id].questions){
  total++;const chosen=doc.answers[id]?.[q.question];if(chosen===undefined)continue;
  answered++;if(q.options.some(o=>o.text===chosen&&o.correct))correct++;
  else wrong.push({id,question:q.question,selected:chosen});
 }}
 return {completed:doc.completed.length,answered,correct,total,wrong,accuracy:answered?Math.round(correct/answered*100):null};
}
