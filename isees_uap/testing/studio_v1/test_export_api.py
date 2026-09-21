from isees_uap.api.v1.studio_v1 import CreateExportRequest, _export_response
from isees_uap.testing.studio_v1.test_application import application
from isees_uap.testing.studio_v1.test_persistence import make_command


def test_export_response_and_cross_scope_fail_closed(tmp_path):
    app=application(tmp_path); app.start(); command=make_command(projections=0); app.save("principal-1","investigation-1",command)
    request=CreateExportRequest(format="PDF",templateProfileVersion="investigation-report-pdf/1",rendererVersion="studio-v1-reportlab-pdf/1",configurationHash="sha256:6d1e0783d1fe839271f281ee34b7355a618291c6e31b1282cfc170e297dab200",idempotencyKey="api-1")
    record=app.create_export("principal-1","investigation-1",command.artifact.artifactId,command.revision.revisionId,format=request.format,template_version=request.templateProfileVersion,renderer_version=request.rendererVersion,configuration_hash=request.configurationHash,idempotency_key=request.idempotencyKey)
    response=_export_response(record); assert response.downloadAvailable and response.mediaType=="application/pdf"
    for owner, investigation in (("other","investigation-1"),("principal-1","other")):
        try: app.get_export(owner,investigation,command.artifact.artifactId,command.revision.revisionId,record.export_id)
        except Exception as exc: assert getattr(exc,"code",None).value=="ARTIFACT_NOT_FOUND"
        else: raise AssertionError("cross-scope export leaked")
    app.close()
