function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function stripUnwantedFields(stat) {
  const { image, updated, ...rest } = stat;
  return rest;
}

export { slugify, stripUnwantedFields };
