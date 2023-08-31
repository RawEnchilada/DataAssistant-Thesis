import * as tf from '@tensorflow/tfjs-node';

export default function focalLoss(gamma: number, alpha: number) {
    return (labels:tf.Tensor, predictions:tf.Tensor) => {
        // todo, implement focal loss
    };
}