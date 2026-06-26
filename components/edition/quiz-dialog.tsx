import { useState } from 'react'
import { CheckIcon, SparklesIcon, XIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'
import type { Summary } from '@/lib/edition'

export function QuizDialog({ summary }: { summary: Summary }) {
  const quiz = summary.quiz
  const [open, setOpen] = useState(false)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [submitted, setSubmitted] = useState(false)

  const answeredAll = quiz.every((_, i) => answers[i] !== undefined)
  const score = quiz.reduce((total, question, i) => total + (answers[i] === question.answerIndex ? 1 : 0), 0)
  const perfect = submitted && score === quiz.length

  function reset() {
    setAnswers({})
    setSubmitted(false)
  }

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) window.setTimeout(reset, 200) // reset after the close animation
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">
          <SparklesIcon data-icon="inline-start" />
          Take the quiz
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[85dvh] flex-col overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Quick quiz</DialogTitle>
          <DialogDescription className="truncate">{summary.title}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6">
          {quiz.map((question, qi) => (
            <div key={qi} className="flex flex-col gap-3">
              <p id={`${summary.id}-q${qi}`} className="text-sm font-medium">
                {qi + 1}. {question.question}
              </p>
              <RadioGroup
                aria-labelledby={`${summary.id}-q${qi}`}
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
        </div>

        <DialogFooter className="items-center sm:justify-between">
          {submitted ? (
            <>
              <div className="flex w-full items-center gap-3 sm:w-auto">
                <Progress value={(score / quiz.length) * 100} className="w-24" />
                <span className="text-sm font-medium tabular-nums">
                  {score}/{quiz.length}
                </span>
                {perfect && <Badge variant="secondary">Perfect</Badge>}
              </div>
              <Button variant="outline" onClick={reset}>
                Retake
              </Button>
            </>
          ) : (
            <Button className="w-full sm:w-auto" disabled={!answeredAll} onClick={() => setSubmitted(true)}>
              Check answers
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
