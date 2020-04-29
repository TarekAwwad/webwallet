import { services } from '@services/index';
import { SET_CURRENT_WALLET_BALANCES, SET_CURRENT_WALLET } from './mutations';

export const HYDRATE_CURRENT_WALLET = 'HYDRATE_CURRENT_WALLET';
export const FETCH_WALLET_BALANCES = 'FETCH_WALLET_BALANCES';

export const actions = {
  [HYDRATE_CURRENT_WALLET]: async (
    { commit, state, getters, dispatch },
    wallet,
  ) => {
    let walletTmp = (wallet && Object.assign({}, wallet)) || null;
    if (walletTmp) {
      walletTmp;

      // Save into local storage
      localStorage.setItem('current_wallet', JSON.stringify(walletTmp));
      // Start to fetch data
      const responseBalances = await services.wallet.fetchBalancesList(
        wallet.address /* 'tki1857lr2tn33q9usmlka0n5wppnxqnuyw0muavx3' */,
      );

      const responseValidators = await services.wallet.fetchDelegatorsValidatorsList(
        wallet.address /* 'tki1857lr2tn33q9usmlka0n5wppnxqnuyw0muavx3' */,
      );
      const responseDelegation = await services.wallet.fetchDelegatorsDelegationsList(
        wallet.address /* 'tki1857lr2tn33q9usmlka0n5wppnxqnuyw0muavx3' */,
      );
      const responseUnbondingDelegation = await services.wallet.fetchDelegatorsUnbondingDelegationsList(
        wallet.address /* 'tki1857lr2tn33q9usmlka0n5wppnxqnuyw0muavx3' */,
      );

      const responseWalletTransactionsSend = await services.tx.fetchTxsList(
        {"message.sender" : wallet.address, "message.action": "send" }/* 'tki1857lr2tn33q9usmlka0n5wppnxqnuyw0muavx3' */,
      );


      let transactions = []
      let transactionsRaw = responseWalletTransactionsSend.data.txs

      for (var tx_key in transactionsRaw){

        var tx = transactionsRaw[tx_key]

        let fee = 0
        if (tx.tx.value.fee.amount.length > 0) {
          fee = tx.tx.value.fee.amount[0].amount / Math.pow(10, 6)
        }

        transactions.push([tx.txhash, 'send',
          tx.tx.value.msg[0].value.to_address,
          tx.tx.value.msg[0].value.amount[0].amount / Math.pow(10, 6),
          fee, tx.timestamp
        ])
      }

      const responseWalletTransactionsReceive = await services.tx.fetchTxsList(
        {"transfer.recipient" : wallet.address, "message.action": "send" }/* 'tki1857lr2tn33q9usmlka0n5wppnxqnuyw0muavx3' */,
      );

      transactionsRaw = responseWalletTransactionsReceive.data.txs

      for (var tx_key in transactionsRaw){

        var tx = transactionsRaw[tx_key]

        let fee = 0
        if (tx.tx.value.fee.amount.length > 0) {
          fee = tx.tx.value.fee.amount[0].amount / Math.pow(10, 6)
        }

        transactions.push([tx.txhash, 'receive',
          tx.tx.value.msg[0].value.to_address,
          tx.tx.value.msg[0].value.amount[0].amount / Math.pow(10, 6),
          fee, tx.timestamp
        ])
      }

      const responseWalletTransactionsDelegate = await services.tx.fetchTxsList(
        {"message.sender" : wallet.address, "message.action": "delegate" }/* 'tki1857lr2tn33q9usmlka0n5wppnxqnuyw0muavx3' */,
      );

      transactionsRaw = responseWalletTransactionsDelegate.data.txs

      for (var tx_key in transactionsRaw){
        var tx = transactionsRaw[tx_key]

        let fee = 0

        if (tx.tx.value.fee.amount.length > 0) {
          fee = tx.tx.value.fee.amount[0].amount / Math.pow(10, 6)
        }

        transactions.push([tx.txhash, 'delegate',
          tx.tx.value.msg[0].value.validator_address,
          tx.tx.value.msg[0].value.amount.amount / Math.pow(10, 6),
          fee, tx.timestamp
        ])
      }

      transactions.sort(function(a, b) {
        const date_a = Date.parse(a[5])
        const date_b = Date.parse(b[5])

        let comparison = 0;
        if (date_a > date_b) {
          comparison = 1;
        } else if (date_a < date_b) {
          comparison = -1;
        }
        return comparison * -1;
      })

      // console.log(transactions)
      // console.log('responseValidators :: ', responseValidators);
      // console.log('responseDelegation :: ', responseDelegation);
      // console.log(
        // 'responseUnbondingDelegation :: ',
        // responseUnbondingDelegation,
      // );
      if (responseBalances.data.result) {
        walletTmp = {
          ...walletTmp,
          balances: responseBalances.data.result,
          validators: responseValidators.data.result,
          delegation: responseDelegation.data.result,
          unbondingDelegation: responseUnbondingDelegation.data.result,
          transactions: transactions,
        };
      }
    } else {
      localStorage.removeItem('current_wallet');
    }
    commit(SET_CURRENT_WALLET, walletTmp);
  },
  [FETCH_WALLET_BALANCES]: async (
    { commit, state, getters, dispatch },
    walletId,
  ) => {
    const responseBalances = await services.wallet.fetchBalancesList(
      wallet.address /* 'tki1857lr2tn33q9usmlka0n5wppnxqnuyw0muavx3' */,
    );
    commit(SET_CURRENT_WALLET_BALANCES, responseBalances.data.result);
  },
};