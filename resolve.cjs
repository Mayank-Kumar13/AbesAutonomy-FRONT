const fs = require('fs');

let content = fs.readFileSync('src/pages/admin/AdminPanel.jsx', 'utf8');

// The conflicts are separated by <<<<<<< HEAD, =======, >>>>>>> <commit-hash>
const blocks = content.split('<<<<<<< HEAD\n');
let newContent = blocks[0];

for (let i = 1; i < blocks.length; i++) {
  const block = blocks[i];
  const endHeadIdx = block.indexOf('=======\n');
  const headContent = block.substring(0, endHeadIdx);
  const rest = block.substring(endHeadIdx + 8);
  const endTheirsIdx = rest.indexOf('>>>>>>>');
  const theirsFull = rest.substring(0, endTheirsIdx);
  const theirCommitLabelEnd = rest.indexOf('\n', endTheirsIdx);
  const remaining = rest.substring(theirCommitLabelEnd + 1);

  // Resolution rules based on index or content match:
  if (headContent.includes('useAuth')) {
    // Conflict 1: Imports
    newContent += `import { useAuth } from '../../auth/AuthContext';\nimport { uploadApi, notesApi, metaApi } from '../../services/api';\n`;
  } else if (headContent.includes('Reviews tab state')) {
    // Conflict 2: State variables
    newContent += `  // ─── Reviews tab state ────────────────────────────\n  const [reviews, setReviews] = useState([]);\n  const [reviewsLoading, setReviewsLoading] = useState(false);\n  const [reviewsError, setReviewsError] = useState('');\n  const [deletingReviewId, setDeletingReviewId] = useState(null);\n  const reviewsLoadedRef = useRef(false);\n\n  const [subjects, setSubjects] = useState([]);\n  const [subjectsLoading, setSubjectsLoading] = useState(false);\n  const [subjectsError, setSubjectsError] = useState('');\n`;
  } else if (headContent.includes('loadReviews()')) {
    // Conflict 3: useEffect
    newContent += `    if (tab === 'reviews' && !reviewsLoadedRef.current) {\n      reviewsLoadedRef.current = true;\n      loadReviews();\n    }\n  }, [tab, loadNotes, loadSubjects, loadReviews]);\n`;
  } else if (headContent.includes('resetUploadForm = ()')) {
    // Conflict 4: resetUploadForm
    newContent += `  const resetUploadForm = () => {\n    setFileEntries([]);\n    setUploadProgress(null);\n`;
  } else if (headContent.includes('setUploadProgress(')) {
    // Conflict 5: upload progress inside loop
    newContent += `      setUploadProgress((prev) => ({ done: (prev?.done || 0) + 1, total: fileEntries.length }));\n`;
  } else if (headContent.includes('placeholder="e.g. Unit 3')) {
    // Conflict 6: Subject dropdown rendering
    newContent += `                    <div className="upload-grid">\n                      <div className="upload-field">\n                        <label>Title *</label>\n                        <input\n                          type="text"\n                          value={entry.title}\n                          onChange={(e) => updateFileEntry(entry.id, 'title', e.target.value)}\n                          placeholder="e.g. Unit 3 - Digital Electronics Notes"\n                          disabled={uploading}\n                        />\n                      </div>\n\n                      <div className="upload-field">\n                        <label>Subject *</label>\n                        {subjectsLoading ? (\n                          <select disabled value="">\n                            <option value="">Loading subjects...</option>\n                          </select>\n                        ) : subjectsError ? (\n                          <div className="admin-error">{subjectsError}</div>\n                        ) : subjects.length === 0 ? (\n                          <select disabled value="">\n                            <option value="">No subjects found</option>\n                          </select>\n                        ) : (\n                          <select\n                            value={entry.subject}\n                            onChange={(e) => updateFileEntry(entry.id, 'subject', e.target.value)}\n                            disabled={uploading}\n                          >\n                            <option value="" disabled>Select Subject</option>\n                            {subjects.map((s) => (\n                              <option key={s._id} value={s._id}>\n                                {s.name || s.title || s.subject || s._id}\n                              </option>\n                            ))}\n                          </select>\n                        )}\n                      </div>\n`;
  } else {
    // Unknown conflict, just keep HEAD
    console.log("Unknown conflict", headContent);
    newContent += headContent;
  }
  newContent += remaining;
}

fs.writeFileSync('src/pages/admin/AdminPanel.jsx', newContent);
console.log('Resolved!');
