import * as documentService from '../services/documentService.js';
import * as auditService from '../services/auditService.js';

export async function upload(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ error: 'File required' });
    const result = await documentService.upload(req.user.id, {
      type: req.body.type,
      title: req.body.title,
      filePath: '/uploads/documents/' + req.file.filename,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
    });
    auditService.log({ actorId: req.user.id, action: 'create', entity: 'document', entityId: result.id, details: { title: req.body.title, type: req.body.type }, ipAddress: req.ip }).catch(e => console.error('Audit log error:', e));
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
}

export async function listMy(req, res, next) {
  try {
    const result = await documentService.listByUser(req.user.id);
    res.json(result);
  } catch (e) {
    next(e);
  }
}

export async function listAll(req, res, next) {
  try {
    const result = await documentService.listAll({
      type: req.query.type,
      page: +req.query.page || 1,
      limit: +req.query.limit || 50,
    });
    res.json(result);
  } catch (e) {
    next(e);
  }
}

export async function remove(req, res, next) {
  try {
    const result = await documentService.remove(req.params.id, req.user.id);
    if (!result) return res.status(404).json({ error: 'Document not found' });
    res.status(204).send();
  } catch (e) {
    next(e);
  }
}
