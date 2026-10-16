module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'subject-case': [0],
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'perf',
        'refactor',
        'docs',
        'test',
        'ci',
        'build',
        'chore',
        'style',
        'revert',
      ],
    ],
  },
};
