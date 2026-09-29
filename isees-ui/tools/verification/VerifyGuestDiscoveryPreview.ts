import assert from "node:assert/strict";
import { projectGuestDiscoveryPreview, type GuestDiscoveryLead } from "../../src/evidence/candidates/GuestDiscoveryPreview.ts";

const lead: GuestDiscoveryLead = { leadId:"guest-lead:result-1", query:"query", provider:"provider", result:{ resultId:"result-1",providerResultId:"p",rank:1,title:"Lead",providerReturnedUrl:"https://example.test",normalizedUrl:"https://example.test/",displayUrl:"example.test",displayDomain:"example.test",snippet:"metadata",attribution:"provider",retentionRestrictions:[],providerMetadata:{} } };
const input = { investigationId:"guest-investigation", proposedBy:"guest:test", lead, connection:{leadId:lead.leadId,targetId:"event-1",relationship:"REFERENCES" as const}, targets:[{id:"event-1",label:"Event",type:"EVENT"}], activeLayerIds:["TOPOLOGY","TEMPORAL","TOPOLOGY"] };
const first=projectGuestDiscoveryPreview(input), second=projectGuestDiscoveryPreview({...input,activeLayerIds:["TEMPORAL","TOPOLOGY"]});
assert.deepEqual(first,second);
assert.equal(first?.manifold.governedMutation,false);
assert.deepEqual(first?.layers.map(layer=>layer.id),["TEMPORAL","TOPOLOGY"]);
assert.equal(projectGuestDiscoveryPreview({...input,connection:{...input.connection,targetId:"missing"}}),undefined);
assert.equal(Object.isFrozen(first),true);
console.log("PASS VerifyGuestDiscoveryPreview: deterministic disposable projection and zero governed mutation verified.");
