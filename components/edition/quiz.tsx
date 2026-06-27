import { useState } from 'react'
import { CheckIcon, XIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'
import type { QuizQuestion } from '@/lib/edition'

export function Quiz({ quiz, idPrefix }: { quiz: QuizQuestion[]; idPrefix: string }) {
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [submitted, setSubmitted] = useState(false)

  const answeredAll = quiz.every((_, i) => answers[i] !== undefined)
  const score = quiz.reduce((total, question, i) => total + (answers[i] === question.answerIndex ? 1 : 0), 0)
  const perfect = submitted && score === quiz.length

  return (
    <Card>
      <CardHeader>
        <CardTitle>Test yourself</CardTitle>
        <CardDescription>
          {quiz.length} quick {quiz.length === 1 ? 'question' : 'questions'} on what you just read.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-6">
        {quiz.map((question, qi) => (
          <div key={qi} className="flex flex-col gap-3">
            <p id={`${idPrefix}-q${qi}`} className="text-sm font-medium">
              {qi + 1}. {question.question}
            </p>
            <RadioGroup
              aria-labelledby={`${idPrefix}-q${qi}`}
              value={answers[qi] !== undefined ? String(answers[qi]) : ''}
              onValueChange={(value) => {
                if (!submitted) setAnswers((prev) => ({ ...prev, [qi]: Number(value) }))
              }}
            >
              {question.options.map((option, oi) => {
                const isSelected = answers[qi] === oi
                const isCorrect = question.answerIndex === oi
                const showCorrect = submitted && isCorrect
                const showWrong = submitted && isSelected && !isCorrect
                return (
                  <label
                    key={oi}
                    className={cn(
                      'flex items-center gap-3 rounded-lg border p-3 text-sm transition-colors',
                      submitted ? 'cursor-default' : 'cursor-pointer hover:bg-muted/50',
                      !submitted && isSelected && 'border-foreground/30 bg-muted/60',
                      showCorrect && 'border-foreground/40 bg-foreground/[0.06]',
                      showWrong && 'border-destructive/40 bg-destructive/5',
                    )}
                  >
                    <RadioGroupItem value={String(oi)} disabled={submitted} />
                    <span className="flex-1">{option}</span>
                    {showCorrect && <CheckIcon className="size-4 shrink-0" />}
                    {showWrong && <XIcon className="size-4 shrink-0 text-destructive" />}
                  </label>
                )
              })}
            </RadioGroup>
            {submitted && question.explanation && (
              <p className="rounded-lg bg-muted/60 px-3 py-2 text-xs/relaxed text-muted-foreground">
                <span className="font-medium text-foreground">Why: </span>
                {question.explanation}
              </p>
            )}
          </div>
        ))}
      </CardContent>

      <CardFooter className="flex-wrap items-center justify-between gap-3">
        {submitted ? (
          <>
            <div className="flex items-center gap-3">
              <Progress value={(score / quiz.length) * 100} className="w-24" />
              <span className="text-sm font-medium tabular-nums">
                {score}/{quiz.length}
              </span>
              {perfect && <Badge variant="secondary">Perfect</Badge>}
            </div>
            <Button variant="outline" size="sm" onClick={() => { setAnswers({}); setSubmitted(false) }}>
              Retake
            </Button>
          </>
        ) : (
          <Button size="sm" disabled={!answeredAll} onClick={() => setSubmitted(true)}>
            Check answers
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
