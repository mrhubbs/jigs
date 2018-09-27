
// TODO: deal with potential "collisions" (trying to upload to the remote
// simultaneously from different clients). Maybe need to create a lock file?

module.exports = { }

// TODO: add hook to pull in mocks for site scanning, uploading, and deleting.

// Scan all files on the remote and hash them and store the hashes on the remote
// under the URL `hashUrl`.
module.exports.hashRemote = (url, hashUrl) => {

}

// Upload to remote.
// NOTE: this requires the remote to already be accurately hashed.
module.exports.upload = (url) => {
  // Get all hashes on remote

  // Get all local hashes

  // For each hash that's different or missing on remote, upload file + it's
  // hash to remote

  // For each hash that's present on remote but missing locally, delete file +
  // it's hash on remote

  // Done
}
