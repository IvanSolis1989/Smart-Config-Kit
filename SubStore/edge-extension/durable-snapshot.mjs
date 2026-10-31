// Restricted durable snapshots v1.8.1. Burn URLs are transient preview inputs.
import { SubStoreClient, SyncError, candidateURL, withoutCacheKey, realNodeCount, canonical, sha256 } from './core.mjs';
import { exactBrandName } from './auto-match.mjs';
const SITE = 'https://therun.6128888.xyz', NAME = '都是梦', LIMIT = 4 * 1024 * 1024;
export function snapshotPolicy(origin, name) { return origin === SITE && name === NAME ? { name: NAME, minNodes: 18 } : null; }
export function snapshotNameAllowed(name) { return name === NAME; }
export function chooseSnapshotSubscription({origin,siteNames,catalog}) {
 if (!snapshotPolicy(origin,NAME) || !exactBrandName(NAME,siteNames) || !Array.isArray(catalog)) return {status:'none',count:0};
 const named=catalog.filter(sub=>sub?.name===NAME);
 if(named.length>1)return {status:'ambiguous',count:named.length};
 return named.length===1 && isLocal(named[0]) ? {status:'matched',subscriptionName:NAME,method:'bound_local_snapshot',mode:'local_snapshot'} : {status:'none',count:0};
}
function isLocal(sub) { return sub?.source==='local' && sub.url==='' && typeof sub.content==='string' && !!sub.content.trim(); }
function contentOf(original) { return JSON.stringify({proxies:original}); }
function withoutContent(sub) { const copy={...sub};delete copy.content;return copy; }
function validNodes(original,policy) {
 if (!Array.isArray(original)) throw new SyncError('preview_invalid');
 const nodes=original.filter(n=>!(typeof n?.name==='string' && /^(剩余流量|套餐到期)[:：]/.test(n.name) && realNodeCount([n])===0));
 if(nodes.length<policy.minNodes || nodes.length>10000 || realNodeCount(nodes)!==nodes.length || nodes.some(n=>typeof n.name!=='string'||!n.name.trim()))throw new SyncError('snapshot_nodes_invalid');
 if(new TextEncoder().encode(contentOf(nodes)).length>LIMIT)throw new SyncError('backend_response_too_large');
 return nodes;
}
async function read(client,policy) {
 const sub=await client.request('/api/sub/'+encodeURIComponent(policy.name));
 if(sub?.name!==policy.name || !isLocal(sub) || new TextEncoder().encode(sub.content).length>LIMIT)throw new SyncError('unsupported_subscription');
 return sub;
}
export async function captureSnapshot({settings,candidateUrl,fetcher,policy,checkpoint=async()=>{}}) {
 if(!policy || !snapshotNameAllowed(policy.name) || policy.minNodes!==18)throw new SyncError('unsupported_subscription');
 candidateURL(candidateUrl);await checkpoint();
 const client=new SubStoreClient({...settings,subscriptionName:policy.name},fetcher);
 const preview=await client.request('/api/preview/sub?target=JSON','POST',{name:policy.name,source:'remote',url:withoutCacheKey(candidateUrl),content:'',process:[],noCache:true,noFlow:true,ignoreFailedRemoteSub:false});
 await checkpoint();const original=validNodes(preview?.original,policy);
 if(realNodeCount(preview?.processed)<policy.minNodes)throw new SyncError('snapshot_nodes_invalid');
 return original;
}
export async function verifyDurableSnapshot({settings,policy,expectedRevision,fetcher,checkpoint=async()=>{}}) {
 if(!policy || !snapshotNameAllowed(policy.name) || policy.minNodes!==18 || !/^[a-f0-9]{64}$/.test(expectedRevision||''))throw new SyncError('snapshot_capture_retry_blocked');
 const client=new SubStoreClient({...settings,subscriptionName:policy.name},fetcher);
 const before=await read(client,policy);await checkpoint();
 if(await sha256(before)!==expectedRevision)throw new SyncError('snapshot_capture_retry_blocked');
 const preview=settings.targetId==='cloud' ? await client.request('/api/local-snapshot/'+encodeURIComponent(policy.name)) :
   await client.request('/api/preview/sub?target=JSON','POST',{...before,noCache:true,noFlow:true,ignoreFailedRemoteSub:false});await checkpoint();
 if(settings.targetId==='cloud' && (preview?.allowed!==true || preview.name!==policy.name || preview.minNodes!==policy.minNodes || preview.revision!==expectedRevision))throw new SyncError('snapshot_capture_retry_blocked');
 const originalNodes=settings.targetId==='cloud'?preview.originalNodes:realNodeCount(preview?.original),processedNodes=settings.targetId==='cloud'?preview.processedNodes:realNodeCount(preview?.processed);
 if(!Number.isSafeInteger(originalNodes)||!Number.isSafeInteger(processedNodes)||originalNodes<policy.minNodes || processedNodes<policy.minNodes)throw new SyncError('snapshot_nodes_invalid');
 const after=await read(client,policy);await checkpoint();
 if(canonical(before)!==canonical(after))throw new SyncError('concurrent_change');
 return {status:'unchanged',mode:'local_snapshot',subscriptionName:policy.name,revision:expectedRevision,originalNodes,processedNodes};
}
export async function syncDurableSnapshot({settings,policy,capture,fetcher,saveBackup=async()=>{},checkpoint=async()=>{},dryRun=false,restoreContent,expectedBackup}) {
 if(!policy || !snapshotNameAllowed(policy.name) || policy.minNodes!==18)throw new SyncError('unsupported_subscription');
 const client=new SubStoreClient({...settings,subscriptionName:policy.name},fetcher), path='/api/sub/'+encodeURIComponent(policy.name);
 await checkpoint();const before=await read(client,policy);await checkpoint();
 const cloud=settings.targetId==='cloud';let remotePolicy;
 if(cloud){remotePolicy=await client.request('/api/local-snapshot/'+encodeURIComponent(policy.name));await checkpoint();
  if(remotePolicy?.allowed!==true || remotePolicy.name!==policy.name || remotePolicy.minNodes!==policy.minNodes || typeof remotePolicy.revision!=='string')throw new SyncError('unsupported_subscription');
  if(remotePolicy.revision!==await sha256(before))throw new SyncError('concurrent_change');}
 if(expectedBackup && (await sha256(before.content)!==expectedBackup.expectedContentHash || await sha256(withoutContent(before))!==expectedBackup.otherFieldsHash))throw new SyncError('concurrent_change');
 const original=restoreContent===undefined ? validNodes(await capture(),policy) : null;
 await checkpoint();const content=restoreContent===undefined ? contentOf(original) : restoreContent;
 if(typeof content!=='string' || !content.trim() || new TextEncoder().encode(content).length>LIMIT)throw new SyncError('snapshot_nodes_invalid');
 let preview;
 if(!cloud){preview=await client.request('/api/preview/sub?target=JSON','POST',{...before,content,noCache:true,noFlow:true,ignoreFailedRemoteSub:false});await checkpoint();
  if(realNodeCount(preview?.original)<policy.minNodes || realNodeCount(preview?.processed)<policy.minNodes)throw new SyncError('snapshot_nodes_invalid');}
 const metadata={mode:'local_snapshot',subscriptionName:policy.name,originalNodes:original?.length||(preview?realNodeCount(preview.original):undefined),processedNodes:preview?realNodeCount(preview.processed):undefined};
 if(cloud && dryRun){
  const checked=await client.request('/api/local-snapshot/'+encodeURIComponent(policy.name),'POST',{expectedRevision:remotePolicy.revision,original,dryRun:true});await checkpoint();
  const after=await read(client,policy);await checkpoint();
  if(canonical(after)!==canonical(before)||checked?.status!=='dry_run'||checked.name!==policy.name||checked.revision!==remotePolicy.revision||checked.originalNodes!==original.length||!Number.isSafeInteger(checked.processedNodes)||checked.processedNodes<policy.minNodes)throw new SyncError('writeback_verification_failed');
  return {status:'dry_run',...metadata,originalNodes:checked.originalNodes,processedNodes:checked.processedNodes};
 }
 const current=await read(client,policy);await checkpoint();if(canonical(current)!==canonical(before))throw new SyncError('concurrent_change');
 if(content===before.content && !cloud)return {status:'unchanged',...metadata,revision:await sha256(before)};
 if(dryRun)return {status:'dry_run',...metadata};
 const backup={kind:'content',at:new Date().toISOString(),subscriptionName:policy.name,backendUrl:settings.backendUrl,targetId:settings.targetId||'local',previousContent:before.content,expectedContentHash:await sha256(content),otherFieldsHash:await sha256(withoutContent(before))};
 await checkpoint();await saveBackup(backup);await checkpoint();
 // Backup storage and authorization checks yield. Reject edits made while
 // awaiting them before sending any content write (including restoration).
 // The local API has no conditional PATCH: this narrows, not removes, its race.
 const dispatchState=await read(client,policy);await checkpoint();
 if(canonical(dispatchState)!==canonical(before))throw new SyncError('concurrent_change');
 let result;
 if(cloud){result=await client.request('/api/local-snapshot/'+encodeURIComponent(policy.name),'POST',restoreContent===undefined?{expectedRevision:remotePolicy.revision,original}:{expectedRevision:remotePolicy.revision,restoreContent:content});}
 else await client.request(path,'PATCH',{content});
 await checkpoint();const after=await read(client,policy);await checkpoint();
 if(after.content!==content || canonical(withoutContent(after))!==canonical(withoutContent(before)))throw new SyncError('writeback_verification_failed');
 if(cloud && (!['updated','unchanged'].includes(result?.status) || result.name!==policy.name || !Number.isSafeInteger(result.originalNodes) || !Number.isSafeInteger(result.processedNodes) || result.originalNodes<policy.minNodes || result.processedNodes<policy.minNodes || (original && result.originalNodes!==original.length) || result.revision!==await sha256(after)))throw new SyncError('writeback_verification_failed');
 return {status:restoreContent===undefined?(cloud?result.status:'updated'):'restored',...metadata,revision:await sha256(after),...(cloud?{originalNodes:result.originalNodes,processedNodes:result.processedNodes}:{})};
}
