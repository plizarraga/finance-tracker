import { Prisma } from "@prisma/client";

import { buildAccount } from "@/test/data/build-account";
import { buildAccountSum } from "@/test/data/build-account-sum";
import {
  buildTransferInSum,
  buildTransferOutSum,
} from "@/test/data/build-transfer-sum";

export function buildAccountsWithBalancesScenario() {
  const userId = "user-203";
  const accountA = buildAccount({
    id: "account-101",
    userId,
    initialBalance: new Prisma.Decimal(100),
  });
  const accountB = buildAccount({
    id: "account-102",
    userId,
    name: "Savings",
    initialBalance: new Prisma.Decimal(200),
  });
  const incomeSums = [
    buildAccountSum({
      accountId: accountA.id,
      _sum: { amount: new Prisma.Decimal(50) },
    }),
    buildAccountSum({
      accountId: accountB.id,
      _sum: { amount: new Prisma.Decimal(25) },
    }),
  ];
  const expenseSums = [
    buildAccountSum({
      accountId: accountA.id,
      _sum: { amount: new Prisma.Decimal(20) },
    }),
    buildAccountSum({
      accountId: accountB.id,
      _sum: { amount: new Prisma.Decimal(30) },
    }),
  ];
  const transfersInSums = [
    buildTransferInSum({
      toAccountId: accountA.id,
      _sum: { amount: new Prisma.Decimal(10) },
    }),
    buildTransferInSum({
      toAccountId: accountB.id,
      _sum: { amount: new Prisma.Decimal(15) },
    }),
  ];
  const transfersOutSums = [
    buildTransferOutSum({
      fromAccountId: accountA.id,
      _sum: { amount: new Prisma.Decimal(5) },
    }),
    buildTransferOutSum({
      fromAccountId: accountB.id,
      _sum: { amount: new Prisma.Decimal(8) },
    }),
  ];
  const expected = [
    { ...accountA, balance: 135 },
    { ...accountB, balance: 202 },
  ];

  return {
    userId,
    accounts: [accountA, accountB],
    incomeSums,
    expenseSums,
    transfersInSums,
    transfersOutSums,
    expected,
  };
}
