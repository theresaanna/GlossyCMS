import React from 'react'
import { getSitePlan } from '@/utilities/plan'
import { SubscriptionViewClient } from './Client'

const SubscriptionView: React.FC = () => {
  const plan = getSitePlan()

  return <SubscriptionViewClient plan={plan} />
}

export default SubscriptionView
