export function readPracticeTopicIds(parameters: URLSearchParams): Set<string> {
  const values = [parameters.get('topic'), parameters.get('topics')]
    .filter((value): value is string => Boolean(value))
    .flatMap((value) => value.split(','))
    .map((value) => value.trim())
    .filter(Boolean);

  return new Set(values);
}
