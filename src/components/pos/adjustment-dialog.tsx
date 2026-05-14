'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface AdjustmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  productId: string
  productName: string
  variantId?: string
  variantName?: string
  onSuccess: () => void
}

export function AdjustmentDialog({
  open,
  onOpenChange,
  productId,
  productName,
  variantId,
  variantName,
  onSuccess
}: AdjustmentDialogProps) {
  const [form, setForm] = useState({
    type: 'restock',
    quantity: '',
    note: '',
    poNumber: '',
    unitCost: '',
    totalCost: '',
  })
  const [submitting, setSubmitting] = useState(false)

  async function handleAdjustment() {
    const qty = parseInt(form.quantity)
    if (isNaN(qty) || qty === 0) {
      toast.error('Enter a valid quantity (positive to add, negative to remove)')
      return
    }

    if (!form.note.trim()) {
      toast.error('Notes are required for adjustments')
      return
    }

    let finalQty = qty
    if (form.type === 'restock' || form.type === 'return') {
      finalQty = Math.abs(qty)
    } else if (form.type === 'sale' || form.type === 'void') {
      finalQty = -Math.abs(qty)
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/inventory-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          variantId,
          type: form.type,
          quantity: finalQty,
          note: form.note.trim() || undefined,
          staffName: 'Staff Member', // Or fetch from auth
          poNumber: form.poNumber.trim() || undefined,
          unitCost: form.unitCost ? parseFloat(form.unitCost) : undefined,
          totalCost: form.totalCost ? parseFloat(form.totalCost) : undefined,
        }),
      })
      if (!res.ok) throw new Error()
      const result = await res.json()
      toast.success(
        `Stock adjusted: ${result.previousStock} → ${result.newStock} (${finalQty > 0 ? '+' : ''}${finalQty})`
      )
      onOpenChange(false)
      setForm({ type: 'restock', quantity: '', note: '', poNumber: '', unitCost: '', totalCost: '' })
      onSuccess()
    } catch {
      toast.error('Failed to adjust stock')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust Stock</DialogTitle>
          <DialogDescription>
            {variantName ? `${productName} - ${variantName}` : productName}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="restock">Restock (Add)</SelectItem>
                  <SelectItem value="adjustment">Manual Adjustment</SelectItem>
                  <SelectItem value="return">Customer Return (Add)</SelectItem>
                  <SelectItem value="void">Void/Damage (Subtract)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Quantity (+ or -)</Label>
              <Input
                type="number"
                placeholder="e.g. 10 or -5"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Notes (Required)</Label>
            <Textarea
              placeholder="Reason for adjustment"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
            />
          </div>
          <div className="space-y-2 pt-2 border-t mt-4">
            <h4 className="text-sm font-medium text-zinc-900">Purchase Order Details (Optional)</h4>
          </div>
          <div className="space-y-2">
            <Label>PO Number</Label>
            <Input
              placeholder="e.g. PO-2023-001"
              value={form.poNumber}
              onChange={(e) => setForm({ ...form, poNumber: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Unit Cost</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={form.unitCost}
                onChange={(e) => setForm({ ...form, unitCost: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Total Cost</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={form.totalCost}
                onChange={(e) => setForm({ ...form, totalCost: e.target.value })}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAdjustment} disabled={submitting}>
            {submitting ? 'Saving...' : 'Confirm Adjustment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
